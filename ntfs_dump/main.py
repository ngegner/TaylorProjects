import sys
import argparse
import struct
import datetime


NTFS_BOOT_SECTOR_SIZE = 512
NTFS_ID_STRING = b'NTFS'
MFT_ENTRY_SIZE = 1024
MFT_METAFILE_ID_STRING = b'FILE'

NTFS_BOOT_SECTOR_PARSE_FORMAT = ('<'
     # | Offset | Size | Value | Description                            |
     # |--------|------|-------|----------------------------------------|
'3x' # | 0      | 3    |       | Unused                                 |
'4s '# | 3      | 4    | 'NTFS'| NTFS String Id                         |
'4x' # | 7      | 4    |       | Unused                                 |
'H'  # | B      | 2    |       | Bytes/sector                           |
'b'  # | D      | 1    |       | Sectors/cluster                        |
'34x'# | E      | 34   |       | Unused                                 | 
'Q') # | 30     | 8    |       | MFT Record Number                      |

MFT_METAFILE_PARSE_FORMAT = ('<'
     # | Offset | Size | Value | Description                            |
     # |--------|------|-------|----------------------------------------|
'4s' # | 3      | 4    |       | Magic number 'FILE'                    |
'12x'# | 4      | 12   |       | Unused                                 |
'H'  # | 10     | 2    |       | Sequence Number                        |
'2x' # | 12     | 2    |       | Unused                                 |
'H'  # | 14     | 2    |       | Offset to the First Attribute          |
'H'  # | 16     | 2    |       | Flags                                  |
'L'  # | 18     | 4    |       | Real size of the FILE record           | 
'L'  # | 1C     | 4    |       | Allocated size of the file record      |
'Q'  # | 20     | 8    |       | File reference to the base FILE record |
'H'  # | 28     | 2    |       | Next Attribute Id                      |
'2x' # | 2A     | 2    |       | Align to 4 byte boundary               |
'H') # | 2C     | 2    |       | MFT Record Number                      |

# https://flatcap.github.io/linux-ntfs/ntfs/concepts/attribute_header.html
STANDARD_ATTRIBUTE_HEADER_COMMON_FMT = ('<'
     # | Offset | Size | Value | Description                      |
     # |--------|------|-------|----------------------------------|
'I'  # | 0      | 4    |       | Attribute Type (e.g. 0x10, 0x60) |
'I'  # | 4      | 4    |       | Length (including this header)   |
'B'  # | 8      | 1    | 0     | Non-resident flag                |
'B'  # | 9      | 1    | 0     | Name length                      |
'H'  # | A      | 2    | 0     | Offset to the Name               |
'H'  # | C      | 2    | 0     | Flags                            |
'H') # | E      | 2    |       | Attribute Id (a)                 |

ATTRIBUTE_HEADER_RESIDENT_FMT = ('<'
     # | Offset | Size | Value | Description                           |
     # |--------|------|------------|----------------------------------|
'I'  # | 0      | 4    |            | Attribute Type (e.g. 0x10, 0x60) |
'I'  # | 4      | 4    |            | Length (including this header)   |
'B'  # | 8      | 1    | 0          | Non-resident flag                |
'B'  # | 9      | 1    | 0          | Name length (N)                  |
'H'  # | A      | 2    | 0          | Offset to the Name               |
'H'  # | C      | 2    | 0          | Flags                            |
'H'  # | E      | 2    |            | Attribute Id (a)                 |
'I'  # | 10     | 4    | L          | Length of the Attribute          |
'H'  # | 14     | 2    | 0X18 + 2N  | Offset to the Attribute          |
'B'  # | 16     | 1    |            | Indexed flag                     |
'x') # | 17     | 1    | 0          | Padding                          |
     # | 18     | L    |            | The Attribute                    |

ATTRIBUTE_HEADER_NON_RESIDENT_FMT = ('<'
     # | Offset | Size | Value | Description                            |
     # |--------|------|-------|----------------------------------------|
'I'  # | 0      | 4    |       | Attribute Type (e.g. 0x10, 0x60)       |
'I'  # | 4      | 4    |       | Length (including this header)         |
'B'  # | 8      | 1    | 0     | Non-resident flag                      |
'B'  # | 9      | 1    | 0     | Name length                            |
'H'  # | A      | 2    | 0     | Offset to the Name                     |
'H'  # | C      | 2    | 0     | Flags                                  |
'H'  # | E      | 2    |       | Attribute Id (a)                       |
'Q'  # | 10     | 8    |       | Starting VCN                           |
'Q'  # | 18     | 8    |       | Last VCN                               |
'H'  # | 20     | 2    | 0x40  | Offset to the Data Runs                |
'H'  # | 22     | 2    |       | Compression Unit Size                  |
'4x' # | 24     | 4    | 0x00  | Padding                                |
'Q'  # | 28     | 8    |       | Allocated size of the attribute        |
'Q'  # | 30     | 8    |       | Real size of the attribute             |
'Q') # | 38     | 8    |       | Initialized data size of the stream    |
     # | 18     | L    |       | Data Runs                              |

FILE_NAME_FMT = ('<'
     # | Offset | Size | Value | Description                                  |
     # |--------|------|-------|----------------------------------------------|
'L'  # | 0      | 4    |       | File reference to parent directory           |
'L'  # | 4      | 4    |       | Unused                                       |
'Q'  # | 8      | 8    |       | C Time - File Creation                       |
'Q'  # | 10     | 8    |       | A Time - File Altered                        |
'Q'  # | 18     | 8    |       | MFT changed                                  |
'Q'  # | 20     | 8    |       | File read                                    |
'Q'  # | 28     | 8    |       | Allocated file size                          |
'Q'  # | 30     | 8    |       | Real size of file                            |
'I'  # | 38     | 4    |       | Flags                                        |
'I'  # | 3c     | 4    |       | Unused                                       |
'B'  # | 40     | 1    |       | Filename length in characters (L)            |
'B') # | 41     | 1    |       | Filename namespace                           |
     # | 42     | 2L   |       | File name in Unicode (not null terminated)   |

# https://flatcap.github.io/linux-ntfs/ntfs/attributes/index.html
ATTRIBUTE_TYPE = {}
ATTRIBUTE_TYPE[0x10] = '$STANDARD_INFORMATION'
ATTRIBUTE_TYPE[0x20] = '$ATTRIBUTE_LIST'
ATTRIBUTE_TYPE[0x30] = '$FILE_NAME'
ATTRIBUTE_TYPE[0x40] = '$OBJECT_ID'
ATTRIBUTE_TYPE[0x50] = '$SECURITY_DESCRIPTOR'
ATTRIBUTE_TYPE[0x60] = '$VOLUME_NAME'
ATTRIBUTE_TYPE[0x70] = '$VOLUME_INFORMATION'
ATTRIBUTE_TYPE[0x80] = '$DATA'
ATTRIBUTE_TYPE[0x90] = '$INDEX_ROOT'
ATTRIBUTE_TYPE[0xA0] = '$INDEX_ALLOCATION'
ATTRIBUTE_TYPE[0xB0] = '$BITMAP'
ATTRIBUTE_TYPE[0xC0] = '$SYMBOLIC_LINK'
ATTRIBUTE_TYPE[0xC0] = '$REPARSE_POINT'
ATTRIBUTE_TYPE[0xD0] = '$EA_INFORMATION'
ATTRIBUTE_TYPE[0xE0] = '$EA'
ATTRIBUTE_TYPE[0xF0] = '$PROPERTY_SET'
ATTRIBUTE_TYPE[0x100] = '$LOGGED_UTILITY_STREAM'
ATTRIBUTE_TYPE[0xFFFFFFFF] = 'MFT_END_MARKER'

FILE_SIGNATURE = {}
FILE_SIGNATURE['PDF'] = 0x255044462D
FILE_SIGNATURE['PNG'] = 0x89504E470D0A1A0A
FILE_SIGNATURE['JPG'] = 0xFFD8FFE0
FILE_SIGNATURE['MPEG'] = 0x6674797069736F6D
FILE_SIGNATURE['GIF'] = 0x474946383761


class NTFSVolume:

    def __init__(self, file_path: str, voffset: int) -> None:
        self.file_handle = open(file_path, 'rb')
        self.voffset = voffset
        self.cluster_size = None
        self.mft_offset = None
        self.ntfs_meta_file_entries: list[NTFSFileRecord] = []

        self.parse_boot_sector()
        self.parse_mft()
        self.find_paths_and_directories()

    
    def parse_boot_sector(self) -> None:
        self.file_handle.seek(self.voffset)
        boot_sector = self.file_handle.read(NTFS_BOOT_SECTOR_SIZE)

        (ntfs_id, bytes_per_sector, sectors_per_cluster, mft_cluster_number) = struct.unpack_from(NTFS_BOOT_SECTOR_PARSE_FORMAT, boot_sector)
        assert ntfs_id == NTFS_ID_STRING

        self.cluster_size = bytes_per_sector * sectors_per_cluster
        self.mft_offset = self.voffset + (mft_cluster_number * self.cluster_size)

    
    def parse_mft(self) -> None:
        file_entry_offset = self.mft_offset
        while True:
            try: 
                self.file_handle.seek(file_entry_offset)
                self.ntfs_meta_file_entries.append(NTFSFileRecord(self, file_entry_offset))
                file_entry_offset += MFT_ENTRY_SIZE

                if self.ntfs_meta_file_entries[-1].last_record == True:
                    break
            except:
                break

    
    def find_paths_and_directories(self):
        for entry in self.ntfs_meta_file_entries:
            for attr in entry.attrs:
                if attr.type == '$FILE_NAME':
                    attr.get_file_path()
            

class NTFSFileRecord:

    def __init__(self, ntfs_volume: NTFSVolume, file_entry_offset: int) -> None:
        self.ntfs_volume = ntfs_volume
        self.file_entry_offset = file_entry_offset
        self.data = None
        self.sequence_number = 0
        self.first_attr_offset = 0
        self.flags = 0
        self.real_size = -1
        self.allocated_size = -1
        self.MFT_record_number = -1
        self.attrs: list[NTFSAttribute] = []
        self.last_record = False

        self.last_record = self.parse_metafile_entry_record()
        if not self.last_record:
            self.parse_attr_list()


    def parse_metafile_entry_record(self) -> bool:
        self.ntfs_volume.file_handle.seek(self.file_entry_offset)
        self.data = self.ntfs_volume.file_handle.read(MFT_ENTRY_SIZE)

        values =  struct.unpack_from(MFT_METAFILE_PARSE_FORMAT, self.data)

        metafile_id_string = values[0]
        if metafile_id_string != MFT_METAFILE_ID_STRING:
            return True

        
        self.sequence_number = values[1]
        self.first_attr_offset = values[2]
        self.flags = values[3]
        self.real_size = values[4]
        self.allocated_size = values[5]
        self.MFT_record_number = values[8]

        return False

    
    def parse_attr_list(self) -> None:
        attr_offset = self.first_attr_offset
        cursor = NTFSAttribute(self, attr_offset)

        while cursor.type != 'MFT_END_MARKER':
            self.attrs.append(cursor)
            attr_offset += cursor.length
            cursor = NTFSAttribute(self, attr_offset)


class NTFSAttribute:

    def __init__(self, file_record: NTFSFileRecord, attr_offset: int) -> None:
        self.file_record = file_record
        self.attr_offset = attr_offset
        self.type = None
        self.non_resident = None
        self.length = -1
        self.creation_time = -1
        self.altered_time = -1
        self.parent_directory_MFT_record_number = -1
        self.path = ''
        self.is_directory = False

        self.unpack_attr()


    def unpack_attr(self):
        standard_values = struct.unpack_from(STANDARD_ATTRIBUTE_HEADER_COMMON_FMT, self.file_record.data, self.attr_offset)        
        self.type = ATTRIBUTE_TYPE[standard_values[0]]
        self.length = standard_values[1]
        self.non_resident = standard_values[2]
        self.offset_to_name = standard_values[4]

        if self.non_resident == 0:
            self.unpack_resident_attr()


    def unpack_resident_attr(self):
        values = struct.unpack_from(ATTRIBUTE_HEADER_RESIDENT_FMT, self.file_record.data, self.attr_offset)
        self.offset_to_attr = values[8]

        if self.type == '$FILE_NAME':
            self.unpack_file_name_attr()

    
    def unpack_file_name_attr(self):
        file_name_values = struct.unpack_from(FILE_NAME_FMT, self.file_record.data, self.attr_offset + self.offset_to_attr)
        self.parent_directory_MFT_record_number = file_name_values[0]
        self.creation_time = file_name_values[2]
        self.altered_time = file_name_values[3]
        self.allocated_size = file_name_values[6]
        self.real_size = file_name_values[7]
        self.file_name_length = file_name_values[10]

        (self.file_name) = struct.unpack_from(f'<{self.file_name_length * 2}s', self.file_record.data, self.attr_offset + self.offset_to_attr + 65)
        self.file_name = self.file_name[0].decode('utf-8', 'ignore')
    

    def get_file_path(self):
        path = f'{self.file_name}'
        current_attr = self

        if current_attr.file_record.MFT_record_number == 5:
            self.path = path
            return
            
        while True:
            if current_attr.file_record.MFT_record_number == current_attr.parent_directory_MFT_record_number:
                 self.path = f'{path}/{current_attr.file_name}'
                 return

            parent_file_record = current_attr.file_record.ntfs_volume.ntfs_meta_file_entries[current_attr.parent_directory_MFT_record_number]

            for attr in parent_file_record.attrs:
                attr.is_directory = True

                if attr.file_record.MFT_record_number == 5:
                    self.path = f'/{path}'
                    return

                if attr.type == '$FILE_NAME':
                    path = f'{attr.file_name}/{path}'
                    current_attr = attr

    
    def print_file_info(self):
        file_or_directory = 'Directory' if self.is_directory else 'File'
        real_size = self.real_size if self.real_size else 'N/A'

        print(f'File Number: {self.file_record.MFT_record_number}')
        print(f'        {file_or_directory} Name: {self.file_name}')
        print(f'        Path: {self.path}')
        print(f'        Creation Time: {datetime.datetime.fromtimestamp(float(self.creation_time) / 100000000)}')
        print(f'        Alteration Time: {datetime.datetime.fromtimestamp(float(self.altered_time) / 100000000)}')
        print(f'        Allocated Size: {self.allocated_size}')
        print(f'        Real Size: {real_size}')
        print('\n-----------------------------------------\n')


def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='NTFS Dumper')
    parser.add_argument('ntfs_img', type=str, help='Image file path')
    parser.add_argument('voffset', type=int, help='Offset where NTFS Volume begins in img (bytes)')
    return parser.parse_args()


def find_paths_and_directories(img: NTFSVolume):
    for entry in img.ntfs_meta_file_entries:
        for attr in entry.attrs:
            if attr.type == '$FILE_NAME':
                attr.get_file_path()


def main() -> int:
    args = get_args()
    img = NTFSVolume(args.ntfs_img, args.voffset)

    for entry in img.ntfs_meta_file_entries:
        for attr in entry.attrs:               
            if attr.type != '$FILE_NAME':
                continue
            
            attr.print_file_info()

    return 0


if __name__ == '__main__':
    sys.exit(main())
